import React from 'react';
import firebase from '../../firebase';
import AvatarEditor from 'react-avatar-editor';

import { Grid, Header, Icon, Dropdown, Image, Modal, Input, Button } from 'semantic-ui-react';

class UserPanel extends React.Component {
    state={
        modal: false,
        previewImage: '',
        croppedImage: '',
        uploadedCroppedImage: '',
        blob: '',
        storageRef: firebase.storage().ref(),
        userRef: firebase.auth().currentUser,
        usersRef: firebase.database().ref('users'),
        metadata: {
            contentType: 'image/jpeg'
        }
    }

    openModal = () => this.setState({ modal: true });

    closeModal = () => this.setState({ modal: false });

    dropdownOptions = user => [
        {
            key: 'user',
            text: <span>Signed in as <strong>{user}</strong></span>,
            disabled: true
        },
        {
            key: 'avatar',
            text: <span onClick={this.openModal}>Change Avatar</span>
        },
        {
            key: 'signout',
            text: <span onClick={this.handleSignout} >Sign Out</span>
        }
    ];

    handleSignout = () => {
        firebase
            .auth()
            .signOut()
            .then(() => console.log('signed out'));
    };

    handleChange = event => {
        const file = event.target.files[0];
        const reader = new FileReader();

        if (file) {
            reader.readAsDataURL(file);
            reader.addEventListener('load', () => {
                this.setState({ previewImage: reader.result });
            });
        }
    };

    handleCropImage = () => {
        if (this.avatarEditor) {
            this.avatarEditor.getImageScaledToCanvas().toBlob(blob => {
                let imageUrl = URL.createObjectURL(blob);
                this.setState({
                    croppedImage: imageUrl,
                    blob
                });
            })
        }
    }

    uploadCroppedImage = () => {
        const { storageRef, userRef, blob, metadata } = this.state;

        storageRef
            .child(`avatars/users/${userRef.uid}`)
            .put(blob, metadata)
            .then(snap => {
                snap.ref.getDownloadURL().then(downloadURL => {
                    this.setState({ uploadedCroppedImage: downloadURL }, () => {
                        this.changeAvatar()
                    })
                })
            });
    }

    changeAvatar = () => {
        this.state.userRef
            .updateProfile({
                photoURL: this.state.uploadedCroppedImage
            })
            .then(() => {
                console.log('PhotoURL updated');
                this.closeModal();
            })
            .catch(err => {
                console.error(err);
            });

        this.state.usersRef
            .child(this.props.user.uid)
            .update({ avatar: this.state.uploadedCroppedImage })
            .then(() => {
                console.log('User avatar updated');
            })
            .catch(err => {
                console.error(err);
            });
    }

    render() {
        const { user } = this.props;
        const { modal, previewImage, croppedImage } = this.state;

        return (
            <Grid>
                <Grid.Column>
                    <Grid.Row className="user-panel">
                        {/* App Header */}
                        <Header inverted floated="left" as="h3">
                            <Icon name="code" />
                            <Header.Content>KevChat</Header.Content>
                        </Header>
                        {/* User Dropdown */}
                        <Header className="user-panel__header" as="h4" inverted>
                            <Dropdown 
                                trigger={
                                    <span>
                                        <Image src={user.photoURL} spaced="right" avatar />
                                        {user.displayName}
                                    </span>
                                } 
                                options={this.dropdownOptions(user.displayName)} 
                            />
                        </Header>
                    </Grid.Row>

                    {/* Change User Avatar Modal */}
                    <Modal basic open={modal} onClose={this.closeModal}>
                         <Modal.Header>Change Avatar</Modal.Header>
                         <Modal.Content>
                             <Input
                                onChange={this.handleChange}
                                fluid
                                type="file"
                                label="New Avatar"
                                name="previewImage"
                             />
                             <Grid centered stackable columns={2}>
                                 <Grid.Row centered>
                                    <Grid.Column className="ui center aligned grid">
                                        {previewImage && (
                                            <AvatarEditor
                                                ref={node => (this.avatarEditor = node)}
                                                image={previewImage}
                                                width={120}
                                                height={120}
                                                border={50}
                                                scale={1.2}
                                            />
                                        )}
                                    </Grid.Column>
                                    <Grid.Column>
                                        {croppedImage && (
                                            <Image
                                                className="image-preview"
                                                width={100}
                                                height={100}
                                                src={croppedImage}
                                            />
                                        )}
                                    </Grid.Column>
                                 </Grid.Row>
                             </Grid>
                         </Modal.Content>
                         <Modal.Actions>
                             {croppedImage && <Button color="green" inverted onClick={this.uploadCroppedImage}>
                                 <Icon name="save" /> Save Avatar
                             </Button>}
                             <Button color="green" inverted onClick={this.handleCropImage}>
                                 <Icon name="image" /> Preview
                             </Button>
                             <Button color="red" inverted onClick={this.closeModal}>
                                 <Icon name="remove" /> Cancel
                             </Button>
                         </Modal.Actions>
                    </Modal>
                </Grid.Column>
            </Grid>
        );
    }
}



export default UserPanel;